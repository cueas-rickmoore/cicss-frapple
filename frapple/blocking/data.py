
import datetime
import json

import numpy as N

from tornado.httputil import HTTPHeaders, ResponseStartLine

from atmosci.utils.timeutils import asDatetimeDate, elapsedTime

from csftool.utils import validateSeasonDates

from frapple.blocking.handler import AppleFrostBlockingRequestHandler
from frapple.blocking.handler import AppleFrostVarietyRequestHandler

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

TOOL_DATA_HANDLERS =  { }

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostLocationRequestHandler(AppleFrostBlockingRequestHandler):

    def __call__(self, request):
        # decode request variables into a dictionary
        #request_dict = self.requestAsDict(request)

        # compose JSON response string from default location
        response_json = '{"locations":%s' % self.tool.locations_js
        loc_name = self.tool.default_location
        response_json = '%s,"selected":"%s"}' % (response_json, loc_name)

        headers = { "Content-Type": "application/json",
                    "Content-Length": "%d" % len(response_json) }
        if "Origin" in request.headers:
            origin = request.headers["Origin"]
            headers["Access-Control-Allow-Origin"] = origin
        request.connection.write_headers(
                           ResponseStartLine(request.version, 200, 'OK'),
                           HTTPHeaders(**headers))
        request.connection.write(response_json)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_DATA_HANDLERS['locations'] = AppleFrostLocationRequestHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostDataRequestHandler(AppleFrostVarietyRequestHandler):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def initializeResponse(self, request, filetype):
        # decode request variables into a dictionary
        request_dict = self.requestAsDict(request)
        # get key parameters from request dict or config file defaults
        varieties = self.extractVarietyParameters(request_dict)
        variety = varieties['variety']

        # extract location coordinates
        location = self.extractLocationParameters(request_dict)
        if 'coords' in location:
            location['lat'] = location['coords'][0]
            location['lon'] = location['coords'][1]
            del location['coords']

        # get the configured season limits
        season = request_dict.get('season', None)
        dates = self.extractSeasonDates(request_dict, season)
        season = dates['season']

        if filetype == 'risk':
            reader =  \
            self.riskFileReader(variety, season, self.source, self.region)
        elif filetype == 'stage':
            reader =  \
            self.stageFileReader(variety, season, self.source, self.region)
        else:
            raise KeyError, '%s is not a valid file type' % filetype
        if self.debug:
            print filetype, 'data file :', reader.filepath

        # capture the significant dates from the min temp dataset
        if 'dates' in self.mode_config \
        and target_year == self.mode_config.season:
            dates.update(self.mode_config.dates.attrs)
        else: dates.update(reader.significantDates('mint'))
        # make sure the dates from files, etc. are kosher
        dates = validateSeasonDates(dates)

        # initialize the response dictionary
        response_dict = { "%s" % filetype:
                          { "variety":variety, "location":location,
                            "dates":"season_dates", "data":"data_arrays" }
                        }
        response = self.tightJsonString(response_dict).replace('\\"','"')

        # insert season dates into the "season_dates' placeholder
        season_dates = self.dateDictToJSON(dates)
        response = response.replace('"season_dates"', season_dates)
        if self.debug:
            print '\ninitilized response\n', response, '\n'

        return reader, location, dates, response

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def respondWithJSON(self, request, response_json):
        headers = { "Content-Type": "application/json",
                    "Content-Length": "%d" % len(response_json) }
        if "Origin" in request.headers:
            origin = request.headers["Origin"]
            headers["Access-Control-Allow-Origin"] = origin
        request.connection.write_headers(
                           ResponseStartLine(request.version, 200, 'OK'),
                           HTTPHeaders(**headers))
        request.connection.write(response_json)


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostRiskDataHandler(AppleFrostDataRequestHandler):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        reader, location, dates, response = \
            self.initializeResponse(request, 'risk')

        lat = location['lat']
        lon = location['lon']

        start_date = asDatetimeDate(dates['season_start'])
        last_valid = asDatetimeDate(dates['last_valid'])

        # get the min temp data slice at the requested location
        data_slice = \
            reader.dataAtNode('mint', lon, lat, start_date, last_valid)
        reader.close() # temporarily free up the file
        if self.verbose:
            print '\nmint array size =', len(data_slice)
            print data_slice
        # initialize response data with min temp slice
        data = ['"mint":%s' % self.serializeData(data_slice, '%d'),]

        # get the data slice at the location for each kill temp dataset
        for dataset in ("T10","T50","T90"):
            reader.open()
            data_slice = \
                reader.dataAtNode(dataset, lon, lat, start_date, last_valid)
            reader.close()
            if self.verbose:
                print '\n', dataset, 'array size =', len(data_slice)
                print data_slice
            # add the kill data
            template = '"%s":%%s' % dataset
            data.append(template % self.serializeData(data_slice, '%d'))
        reader.close()
        del reader

        # insert the actual data into the "data_arrays" placeholder
        response = response.replace('"data_arrays"', "{%s}" % ','.join(data))
        if self.debug:
            print '\nAppleFrostRiskDataHandler response'
            print response

        # send the response
        self.respondWithJSON(request, response)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_DATA_HANDLERS['risk'] = AppleFrostRiskDataHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostSeasonDatesHandler(AppleFrostBlockingRequestHandler):

    def __call__(self, request):
        # decode request variables into a dictionary
        request_dict = self.requestAsDict(request)
        # target_year
        target_year = request_dict.get('season', None)
        # get the configured season limits
        dates = self.extractSeasonDates(request_dict, target_year)
        if self.verbose:
            print 'season dates array size', len(dates)
            print dates
        response = '{"season":{"season_start":"%s","season_end":"%s"'
        response = response % (dates['season_start'], dates['season_end'])

        # create an array of days for X axis of data plots
        days = self.serializeDates(asDatetimeDate(dates['season_start']),
                                   asDatetimeDate(dates['season_end']))
        response = '%s,"dates":%s}}' % (response, days)
        if self.debug:
            print '\nAppleFrostSeasonDatesHandler response'
            print response

        # send the respnse
        self.respondWithJSON(request, response)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_DATA_HANDLERS['season'] = AppleFrostSeasonDatesHandler


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostStageDataHandler(AppleFrostDataRequestHandler):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def __call__(self, request):
        # decode request variables into a dictionary
        request_dict = self.requestAsDict(request)

        reader, location, dates, response = \
            self.initializeResponse(request, 'stage')
        if self.debug: print '\nstage data file :', reader.filepath

        lat = location['lat']
        lon = location['lon']

        start_date = asDatetimeDate(dates['season_start'])
        last_valid = asDatetimeDate(dates['last_valid'])

        # get the stage data slice at the requested location
        reader.open()
        data_slice = \
            reader.dataAtNode('stage', lon, lat, start_date, last_valid)
        reader.close()

        # need to stop at actual last stage that has been achieved -- we can't 
        # always rely on last_valid being == actual date at end of last stage
        max_stage = N.nanmax(data_slice)
        indexes = N.where(data_slice == max_stage)
        max_stage_index = indexes[0][-1]
        max_stage_date = \
            start_date + datetime.timedelta(days=max_stage_index)
        if self.verbose:
            print 'stage data size', len(data_slice)
            print 'max stage', max_stage_index, max_stage_date
            print data_slice

        # create a list of start/end dates for each stage
        prev_start = None
        stages = [ ]
        # reverse order loop makes it easier to handle mssing stages
        for stage in range(max_stage, 0, -1):
            indexes = N.where(data_slice == stage)
            if len(indexes[0]) > 0:
                delta = datetime.timedelta(days=indexes[0][0])
                stage_start = start_date + delta
                if prev_start is None:
                    delta = datetime.timedelta(days=indexes[0][-1])
                    stage_end = start_date + delta
                else: stage_end = prev_start
                start = stage_start.strftime("%Y-%m-%d")
                end = stage_end.strftime("%Y-%m-%d")
                stages.append('["%s","%s"]' % (start, end))
                prev_start = stage_start
        # add dormant stage (i.e. stage 0)
        if prev_start is None: # no other stages ... all valid dates = dormant 
            stages.append('["%s","%s"]' % (start_date, last_valid))
        else: # dormant right up to stage 1 start
            stages.append('["%s","%s"]' % (start_date, prev_start))
        stages.reverse()
        data = '[%s]' % ','.join(stages).replace(' ','')

        # insert the actual data into the "data_arrays" placeholder
        response = response.replace('"data_arrays"', data)
        if self.debug:
            print '\nAppleFrostStageDataHandler response'
            print response

        # send the response
        self.respondWithJSON(request, response)

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

TOOL_DATA_HANDLERS['stage'] = AppleFrostStageDataHandler

