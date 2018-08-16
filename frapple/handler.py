
import datetime

from frapple.methods import AppleFrostToolCommonMethods


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostRequestHandlerMethods(AppleFrostToolCommonMethods):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def dateDictToJSON(self, date_dict):
        """ convert dictionary of season dates into a JSON dictionary
        """
        dates = [ ]
        for name, date in date_dict.items():
            if isinstance(date, datetime.date):
                dates.append('"%s":"%s"' % (name,date.strftime('%Y-%m-%d')))
            elif isinstance(date, int):
                dates.append('"%s":%d' % (name, date))
            else: dates.append('"%s":"%s"' % (name, date))
        return "{%s}" % ','.join(dates)    

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def defaultDOI(self, target_year):
        doi = self.tool.default_doi
        if doi[0] > self.tool.season_end_day[0]:
            return datetime.date(target_year-1, *doi)
        return datetime.date(target_year, *doi)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def defaultStartDate(self, target_year):
        return datetime.date(target_year-1, *self.tool.season_start_day)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractDataAccessParameters(self, request_dict):
        return self.extractLocationParameters(request_dict)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractSeasonDates(self, request_dict):
        # check for multiple years ... always a sequence
        min_year = self.tool.get('first_year', self.minAvailableSeason())
        max_year = self.tool.get('last_year', self.maxAvailableSeason())
        parameters = { 'min_year':min_year,  'max_year': max_year } 

        # default season parameters
        season = self.mode_config.get('season', max_year)
        if isinstance(season, basestring): season = int(season)
        parameters['season'] = season

        season_end = self.seasonEndDate(season)
        parameters['season_end'] = self.appDateFormat(season_end)

        season_start = self.seasonStartDate(season)
        parameters['season_start'] = self.appDateFormat(season_start)

        if 'doi' in request_dict:
            parameters['doi'] = request_dict['doi'] 

        return parameters

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def formatSeasonDescription(self, season):
        year = int(season)
        template = self.tool.season_description
        return template % {'start_year': year-1, 'end_year':year}

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setToolConfig(self, server_config):
        # create attribute for reference to tool config
        server_tool = server_config.get('tool', None)
        if server_tool is not None:
            self.tool.update(server_tool)
        self.toolname = self.server_config.get('toolname', self.toolname)
        self.tool.mode = server_config.mode

        key = self.tool.get('data_region_key', self.project.region)
        self.region = self.regionConfig(key)
        key = self.tool.get('data_source_key', self.project.source)
        self.source = self.sourceConfig(key)

   # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def stringToDate(self, date_string):
        date = tuple([int(part) for part in date_string.split('-')])
        return datetime.date(*date)

