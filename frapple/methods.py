
import datetime

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostToolCommonMethods:

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def appDateFormat(self, date):
        return date.strftime('%Y-%m-%d')

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

    def dayToSeasonDate(self, season, day):
        if day[0] <= self.tool.season_end_day[0]:
            return datetime.date(season, *day)
        if day[0] >= self.tool.season_end_day[0]:
            return datetime.date(season-1, *day)
        return None

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

    def formatSeasonDescription(self, season):
        year = int(season)
        template = self.tool.season_description
        return template % {'start_year': year-1, 'end_year':year}

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def seasonEndDate(self, target_year):
        return datetime.date(target_year, *self.tool.season_end_day)

    def seasonStartDate(self, target_year):
        start_day = self.tool.season_start_day
        if start_day[0] > self.tool.season_end_day[0]:
            return datetime.date(target_year-1, *start_day)
        return datetime.date(target_year, *start_day)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def maxAvailableYear(self, date):
        season_start = datetime.date(date.year, *self.project.start_day)
        if date >= season_start: return date.year + 1
        else: return date.year

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def targetYear(self, date):
        season_start = datetime.date(date.year, *self.project.start_day)
        if date >= season_start:
            target_year = date.year+1
        else: 
            season_start = datetime.date(date.year-1, *self.project.start_day)
            target_year = date.year
        season_end = datetime.date(target_year, *self.project.end_day)
        if date <= season_end: return target_year
        else: return None


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class FrapplePropertyMethods(AppleFrostToolCommonMethods):

    def __init__(self, config, mode='prod'):
        self.tool = config.tool
        self.config = config
        self.mode_config = config.mode

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def toolProperties(self):
        year  = self.mode_config.get('season', None)
        if year is not None: year = datetime.date.today().year
        # add default date of interest
        default_doi = self.tool.default_doi
        if not isinstance(default_doi, basestring): # needs to be YYYY-MM_DD
            default_doi = \
                self.appDateFormat(self.dayToSeasonDate(year,default_doi))
        properties['default_doi'] = default_doi 
        properties['days_in_view'] = self.tool.days_in_view

        # add viriety deafults
        properties['default_variety'] = self.tool.default_variety
        varieties_js = [ ]
        for key in self.tool.varieties:
            description = server_config.tool.varieties[key].description
            varieties[key] = description
            varieties_js.append('%s:"%s"' % (key,description))
        properties['varieties_js'] = '{%s}' % ','.join(varieties_js)

        # check for multiple years ... always a sequence
        properties['min_year'] = self.tool.first_season
        if properties['min_year'] is None:
            today = datetime.date.today()
            properties['min_year'] = self.maxAvailableYear(today)
            properties['max_year'] = properties['min_year']
        else:
            max_year = self.tool.get('last_season',None)
            if max_year is None:
                today = datetime.date.today()
                max_year = self.maxAvailableYear(today)
            properties['max_year'] = max_year
        return properties

    
    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def serverProperties(self):
        server_url = self.mode_config.server_url
        toolname = self.tool.toolname
        properties = { 'server_url':server_url, 'toolname':toolname }
        properties['tool_url'] = self.mode_config.get('tool_url',
                                 "%s/%s"  % (server_url,toolname))
        properties['csftool_url'] = \
            self.mode_config.get('csftool_url', "%s/csftool"  % server_url)
        return properties
